<template>
    <div class="row g-3">
    <div v-for="maxCount in [{key:50,func:countTo50,store:costTo50},{key:100,func:countTo100,store:costTo100},{key:250,func:countTo250,store:costTo250}]" :key="maxCount.key">
        <div v-if="maxCount.func > 0" class="col-12">
            <div class="heading-6">
                <span>{{ $t(`costTo${maxCount.key}`) }}</span>
            </div>
            
                <div v-for="resource in ['titanium','gold','silicon','meteorite','ice']" class="row g-1" :key="resource">
                <div class="col-auto d-flex align-items-center">
                    <img :src="require(`../assets/interface/${resource}.png`)" width="12" height="12" />
                </div>
                <div class="col">
                    <small class="text-light">{{ $t(resource) }}</small>
                </div>
                <div class="col-auto">
                    <small class="text-uppercase" :class="{ 'text-light':maxCount.store[resource].count <= data[resource].storage, 'text-excess':maxCount.store[resource].count <= getStorageCap(resource) && maxCount.store[resource].count > data[resource].storage, 'text-danger':maxCount.store[resource].count > getStorageCap(resource) }">{{ numeralFormat(maxCount.store[resource].count.toPrecision(4), '0.[000]a') }}</small>
                </div>
                <div class="col-auto text-end" style="width:75px">
                    <small v-if="data[resource].prod <= 0" class="text-normal">---</small>
                    <small v-if="maxCount.store[resource].count <= data[resource].count" class="text-success"><i class="fas fa-fw fa-check"></i></small>
                    <small v-if="maxCount.store[resource].count > data[resource].count && maxCount.store[resource].timer > (3600 * 24 * 2)" class="text-timer">{{ $t('bigTimer') }}</small>
                    <small v-if="maxCount.store[resource].count > data[resource].count && maxCount.store[resource].timer > 0 && maxCount.store[resource].timer <= (3600 * 24 * 2)" class="text-timer" role="timer"><timer :value="maxCount.store[resource].timer" /></small>
                </div>                
                </div>
        </div>
 
    </div>
</div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Timer from './Timer.vue'

export default {
    components: {
        'timer': Timer,
    },
    computed: {
        ...mapState([
            'data',
        ]),
        ...mapGetters([
            'getStorageCap',
        ]),

        countTo50: function() { return 50 - this.data['segment'].count },
        countTo100: function() { return 100 - this.data['segment'].count },
        countTo250: function() { return 250 - this.data['segment'].count },

        costTo50: function(){return this.costToX(50)},
        costTo100: function(){return this.costToX(100)},
        costTo250: function(){return this.costToX(250)},
    },
    methods: {
        computeCost(base, n) {
            return Math.floor(base * (1 - Math.pow(1.02, n)) / (1 - 1.02))
        },
        costToX(x){
            const getCost  = (cost)=>this.computeCost(cost, x) - this.computeCost(cost, this.data['segment'].count) 
            let [costTitanium,
            costGold     ,
            costSilicon  ,
            costMeteorite, 
            costIce       
            ]  = this.data['segment'].baseCosts.map(({count})=>(getCost(count)));
            
            if (this.data['titanium'].titan == true) costTitanium *= 0.1
            if (this.data['gold'].titan == true) costGold *= 0.1
            if (this.data['silicon'].titan == true) costSilicon *= 0.1
            if (this.data['meteorite'].titan == true) costMeteorite *= 0.1
            if (this.data['ice'].titan == true) costIce *= 0.1
            
            return {
                titanium:  { count: costTitanium,  timer: this.data['titanium'].prod > 0 ? (costTitanium - this.data['titanium'].count) / this.data['titanium'].prod : 0    },
                gold:      { count: costGold,      timer: this.data['gold'].prod > 0 ? (costGold - this.data['gold'].count) / this.data['gold'].prod : 0                },
                silicon:   { count: costSilicon,   timer: this.data['silicon'].prod > 0 ? (costSilicon - this.data['silicon'].count) / this.data['silicon'].prod : 0       },
                meteorite: { count: costMeteorite, timer: this.data['meteorite'].prod > 0 ? (costMeteorite - this.data['meteorite'].count) / this.data['meteorite'].prod : 0 },
                ice:       { count: costIce,       timer: this.data['ice'].prod > 0 ? (costIce - this.data['ice'].count) / this.data['ice'].prod : 0                   },
            }
        }
    },
}
</script>